defmodule Echoserver do
  require Logger

  @moduledoc """
  Documentation for Echoserver.
  """

  @doc """
  Hello world.

  ## Examples

      iex> Echoserver.hello()
      :world

  """
  def hello do
    :world
  end

  def accept(port \\ 4040) do
    {:ok, socket} =
      :gen_tcp.listen(port, [:binary, packet: :line, active: false, reuseaddr: true])

    Logger.info("Accepting connection on port #{port}")
    loop_acceptor(socket)
  end

  defp loop_acceptor(socket) do
    {:ok, client} = :gen_tcp.accept(socket)
    spawn(fn -> serve(client) end)
    loop_acceptor(socket)
  end

  defp serve(socket) do
    socket
    |> read_line()
    |> write_line(socket)

    serve(socket)
  end

  defp read_line(socket) do
    {:ok, data} = :gen_tcp.recv(socket, 0)
    data
  end

  defp write_line(data, socket) do
    :gen_tcp.send(socket, data)
  end
end
